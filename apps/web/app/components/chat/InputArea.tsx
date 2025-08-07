'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  autoFocus?: boolean;
}

export function InputArea({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 10000,
  autoFocus = true,
}: InputAreaProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [shortcutHint, setShortcutHint] = useState('Ctrl+Enter'); // Default for SSR
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    // Platform detection - runs only on client
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    setShortcutHint(isMac ? 'Cmd+Enter' : 'Ctrl+Enter');
  }, []);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on scrollHeight, with min and max
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isComposing.current) {
      e.preventDefault();
      handleSubmit();
    }
    // Prevent plain Enter from submitting (allow for multiline)
    else if (e.key === 'Enter' && !e.shiftKey && !isComposing.current) {
      // Allow normal enter behavior for multiline
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setInput(newValue);
    }
  };

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading || disabled) return;

    onSendMessage(trimmedInput);
    setInput('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
      // Keep focus on textarea after sending
      textareaRef.current.focus();
    }
  };

  const isDisabled = disabled || isLoading;
  const canSend = input.trim().length > 0 && !isDisabled;
  const characterCount = input.length;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="border-t border-[#2a2a2d] bg-[#18181a]">
      <div className="max-w-3xl mx-auto p-4">
        <div className="relative rounded-2xl bg-[#1e1e20] border border-[#2a2a2d] shadow-xl transition-all duration-300 hover:border-[#3b82f6]/20">
          <div className="p-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; }}
                placeholder={placeholder}
                disabled={isDisabled}
                className={cn(
                  "pr-12 resize-none min-h-[56px] max-h-[200px]",
                  "bg-transparent",
                  "border-0 focus:ring-0",
                  "text-[#fafafa]",
                  "placeholder-[#71717a]",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  height: '56px',
                  lineHeight: '1.6',
                }}
                rows={1}
              />

              {/* Character counter */}
              <div className="absolute bottom-2 left-0 text-[11px] text-[#71717a]">
                {isFocused && (
                  <span className={cn(
                    "transition-colors duration-200",
                    isNearLimit && "text-[#ef4444]"
                  )}>
                    {characterCount}/{maxLength}
                  </span>
                )}
              </div>

              {/* Send button */}
              <div className="absolute bottom-2 right-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 rounded-lg",
                    "bg-[#3b82f6] hover:bg-[#3b82f6]/90",
                    "text-white",
                    "transition-all duration-200",
                    "shadow-lg hover:shadow-xl",
                    !canSend && "opacity-30 bg-[#2a2a2d]"
                  )}
                  title={`Send message (${shortcutHint})`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-[#71717a]">
                Press <kbd className="
                  px-1.5 py-0.5 
                  bg-[#2a2a2d] 
                  rounded-md 
                  text-[#a1a1aa]
                  border border-[#2a2a2d]
                  font-mono text-[10px]
                ">{shortcutHint}</kbd> to send
              </span>
              {!isFocused && characterCount > 0 && (
                <span className={cn(
                  "text-[11px] text-[#71717a]",
                  "transition-colors duration-200",
                  isNearLimit && "text-[#ef4444]"
                )}>
                  {characterCount}/{maxLength}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}