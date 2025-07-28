"use client"

import { useState, useRef, useEffect } from "react"
import { PaperAirplaneIcon, UserIcon, SparklesIcon, ArrowPathIcon, TrashIcon, ClipboardIcon, CheckIcon } from "@heroicons/react/24/outline"
import useStore from "../../store/useStore"

const SmartQuery = () => {
  const [inputValue, setInputValue] = useState("")
  const [conversationHistory, setConversationHistory] = useState([])
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const textareaRef = useRef(null)
  const messagesEndRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  const { executeSmartQuery, queryLoading, queryError, queryResponse, currentQuery, clearQueryResponse, user } =
    useStore()

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current?.parentElement || {}
    setIsAtBottom(scrollHeight - (scrollTop + clientHeight) < 50)
  }

  useEffect(() => {
    const container = messagesEndRef.current?.parentElement
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom()
    }
  }, [conversationHistory, queryLoading])

  const lastProcessedRef = useRef(null)

  useEffect(() => {
    if (currentQuery && queryResponse) {
      const currentPairId = `${currentQuery}|||${JSON.stringify(queryResponse)}`
      
      if (lastProcessedRef.current !== currentPairId) {
        lastProcessedRef.current = currentPairId
        
        setConversationHistory((prev) => {
          const hasUserMessage = prev.some(
            (msg) => msg.type === "user" && msg.content === currentQuery
          )
          const hasAiMessage = prev.some(
            (msg) => msg.type === "ai" && JSON.stringify(msg.content) === JSON.stringify(queryResponse)
          )
          if (hasUserMessage && hasAiMessage) {
            return prev
          }
          
          const newMessages = []
          
          if (!hasUserMessage) {
            newMessages.push({
              id: `user-${Date.now()}-${Math.random()}`,
              type: "user",
              content: currentQuery,
              timestamp: new Date(),
            })
          }
          
          if (!hasAiMessage) {
            newMessages.push({
              id: `ai-${Date.now()}-${Math.random()}`,
              type: "ai",
              content: queryResponse,
              timestamp: new Date(),
            })
          }
          
          return [...prev, ...newMessages]
        })
      }
    }
  }, [currentQuery, queryResponse])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || queryLoading) return

    const query = inputValue.trim()
    setInputValue("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    await executeSmartQuery(query)
  }

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleClearChat = () => {
    setConversationHistory([])
    lastProcessedRef.current = null
    clearQueryResponse()
  }

  const handleRetry = async () => {
    if (currentQuery) {
      await executeSmartQuery(currentQuery)
    }
  }

  const handleCopyMessage = async (messageId, content) => {
    try {
      let textToCopy = content
      if (typeof content === "object" && content.response) {
        textToCopy = content.response
      }
      if (typeof textToCopy === "string") {
        // Remove <think> tags and clean up the text
        textToCopy = textToCopy.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      }
      
      await navigator.clipboard.writeText(textToCopy)
      setCopiedMessageId(messageId)
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const suggestedQueries = [
    "What's the floor price of my watched collections?",
    "Show me my most valuable NFTs",
    "What are the trending collections today?",
    "Analyze my portfolio performance",
  ]

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 z-10 backdrop-blur-sm bg-white/80 border-b border-white/20">
        {/* <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">NFT Assistant</h1>
        </div> */}

        {conversationHistory.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Clear chat</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-4xl mx-auto p-4">
          {conversationHistory.length === 0 && !queryLoading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center">
              <div className="w-16 h-16 flex items-center justify-center mb-6">
                <img src="/logo.svg" alt="Aegis Logo" className="w-16 h-16" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                How can I help you today{user?.name ? `, ${user.name}` : ''}?
              </h2>
              <p className="text-gray-600 mb-8 max-w-md">
                Ask me anything about your NFT portfolio, market trends, or get personalized insights.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(query)
                      textareaRef.current?.focus()
                    }}
                    className="p-4 text-left bg-white hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    <p className="text-sm text-gray-700">{query}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {conversationHistory.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex ${message.type === 'user' ? 'max-w-[85%]' : 'max-w-[85%]'} ${message.type === 'user' ? '' : ''}`}>
                  {message.type !== 'user' && (
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center p-1">
                        <img src="/logo.svg" alt="Aegis" className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`rounded-xl px-4 py-3 relative group ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 shadow-sm"
                    }`}
                  >
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                        message.type === "user"
                          ? "hover:bg-blue-700 text-blue-200 hover:text-white"
                          : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      }`}
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <ClipboardIcon className="w-4 h-4" />
                      )}
                    </button>

                    <div className="max-w-none pr-8 text-left">
                      {message.type === "user" ? (
                        <p className="whitespace-pre-wrap text-left">{message.content}</p>
                      ) : (
                        <div className="whitespace-pre-wrap text-gray-800 text-left">
                          {(() => {
                            let content = typeof message.content === "string"
                              ? message.content
                              : message.content.response || JSON.stringify(message.content)
                            
                            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
                            content = content.trim()
                            
                            // Format markdown-style text
                            return content.split('\n').map((line, index) => {
                              // Handle bold text **text**
                              const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                              
                              return (
                                <div key={index} className={index > 0 ? 'mt-2 text-left' : 'text-left'}>
                                  <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading state */}
            {queryLoading && currentQuery && (
              <>
                {!conversationHistory.some(msg => msg.type === "user" && msg.content === currentQuery) && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div className="bg-blue-600 text-white rounded-xl px-4 py-3">
                        <p className="whitespace-pre-wrap">{currentQuery}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-start">
                  <div className="flex max-w-[85%]">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center p-1">
                        <img src="/logo.svg" alt="Aegis" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        {/* <span className="text-sm text-gray-500">Thinking...</span> */}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Error state */}
            {queryError && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%]">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 p-1">
                      <img src="/logo.svg" alt="Aegis" className="w-6 h-6 brightness-0 invert" />
                    </div>
                  </div>
                  <div className="bg-white border border-red-200 rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-sm text-red-800 mb-3">I encountered an error: {queryError}</p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      <span>Try again</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message NFT Assistant..."
              className="w-full px-4 py-7 pr-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-lg"
              style={{ minHeight: "44px", maxHeight: "200px" }}
              disabled={queryLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || queryLoading}
              className={`absolute right-2 bottom-8 p-2 rounded-md transition-colors ${
                inputValue.trim()
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-2 text-xs text-gray-500 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartQuery