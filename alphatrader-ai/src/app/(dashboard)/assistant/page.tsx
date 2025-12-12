"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkProviders();
    // Add welcome message
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm AlphaTrader AI, your intelligent trading assistant. I can help you with:

- **Stock Analysis**: Get insights on any stock's technical and fundamental indicators
- **Market Trends**: Understand current market conditions and sector performance
- **Shariah Screening**: Check if stocks are Shariah-compliant based on AAOIFI standards
- **Portfolio Review**: Discuss your holdings and potential opportunities

Try asking me something like:
- "Analyze AAPL stock for me"
- "What does a P/E ratio of 25 mean?"
- "Is the technology sector overbought?"
- "Explain RSI divergence"`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkProviders = async () => {
    try {
      const response = await fetch("/api/ai/chat");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error("Error checking providers:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .filter((m) => m.id !== "welcome")
            .concat(userMessage)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          provider: selectedProvider === "auto" ? undefined : selectedProvider,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}.

Please ensure you have configured an AI provider:
- **OpenAI**: Add your API key to the .env file (OPENAI_API_KEY)
- **Ollama**: Run Ollama locally at http://localhost:11434`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Analyze AAPL stock",
    "Explain P/E ratio",
    "What is RSI?",
    "Tech sector outlook",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-500" />
            AI Assistant
          </h1>
          <p className="text-gray-400 mt-1">Your intelligent trading companion</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Provider:</span>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="auto">Auto</SelectItem>
                {providers.includes("openai") && (
                  <SelectItem value="openai">OpenAI</SelectItem>
                )}
                {providers.includes("ollama") && (
                  <SelectItem value="ollama">Ollama</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {providers.length > 0 && (
            <div className="flex items-center gap-1 text-green-500 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {providers.length} provider{providers.length > 1 ? "s" : ""} available
            </div>
          )}
          {providers.length === 0 && (
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              No providers configured
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-gray-900 border-gray-800 flex flex-col min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content.split('\n').map((line, i) => {
                      // Handle bold text
                      const parts = line.split(/\*\*(.*?)\*\*/g);
                      return (
                        <div key={i}>
                          {parts.map((part, j) =>
                            j % 2 === 1 ? (
                              <strong key={j}>{part}</strong>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs opacity-50 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex gap-2 flex-wrap">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(prompt)}
                  className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about stocks, markets, or trading..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading}
              className="flex-1 bg-gray-800 border-gray-700 text-white"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
