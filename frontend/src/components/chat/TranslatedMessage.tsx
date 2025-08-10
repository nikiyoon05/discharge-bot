import React, { useState } from 'react';
import { User, Bot, Languages, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslationResult } from '@/services/translationService';

export interface TranslatedMessageProps {
  sender: 'doctor' | 'patient' | 'ai_assistant';
  currentUser: 'doctor' | 'patient';
  originalMessage: string;
  translationResult?: TranslationResult;
  timestamp: string;
  isTranslating?: boolean;
}

export default function TranslatedMessage({
  sender,
  currentUser,
  originalMessage,
  translationResult,
  timestamp,
  isTranslating = false
}: TranslatedMessageProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  
  const isTranslated = translationResult?.isTranslated || false;
  
  // This new logic correctly determines what text to show based on perspective
  const isMyOwnMessage = sender === currentUser;
  
  let textToDisplay: string;
  let toggleButtonText = '';

  if (isMyOwnMessage) {
    // For messages I sent: show my original text by default.
    textToDisplay = originalMessage;
    if (isTranslated) {
      toggleButtonText = showOriginal ? 'Hide Translation' : 'Show My Translation';
      if (showOriginal) {
        textToDisplay = translationResult.translatedText;
      }
    }
  } else {
    // For messages I received: show the translated text by default.
    textToDisplay = isTranslated ? translationResult.translatedText : originalMessage;
    if (isTranslated) {
      toggleButtonText = showOriginal ? 'Show Translation' : 'See Original';
      if (showOriginal) {
        textToDisplay = translationResult.originalText;
      }
    }
  }

  const getSenderIcon = () => {
    switch (sender) {
      case 'patient':
        return <User className="h-5 w-5" />;
      case 'ai_assistant':
        return <Bot className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const getSenderColor = () => {
    if (sender === 'ai_assistant') return 'bg-purple-50 border border-purple-200 text-purple-900';
    if (sender === currentUser) {
      // Current user's message color
      return currentUser === 'doctor' ? 'bg-primary text-primary-foreground' : 'bg-blue-500 text-white';
    }
    // Other user's message color
    return 'bg-muted';
  };

  const getTranslationInfo = () => {
    if (!translationResult || !isTranslated) return null;
    
    return (
      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
        <Languages className="h-3 w-3" />
        <span>
          Translated from {translationResult.sourceLanguage.toUpperCase()} 
          → {translationResult.targetLanguage.toUpperCase()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs underline"
          onClick={() => setShowOriginal(!showOriginal)}
        >
          {showOriginal ? (
            <>
              <Eye className="h-3 w-3 mr-1" />
              Show Translation
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3 mr-1" />
              Show Original
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className={`flex items-start gap-3 ${sender === currentUser ? 'justify-end' : ''}`}>
      {sender !== currentUser && (
        <div className="bg-muted rounded-full p-2">
          {getSenderIcon()}
        </div>
      )}
      
      <div className={`p-3 rounded-lg max-w-lg relative ${getSenderColor()}`}>
        {/* Translation badge */}
        {isTranslated && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 text-xs bg-blue-100 text-blue-800 border-blue-200"
          >
            <Languages className="h-3 w-3 mr-1" />
            Translated
          </Badge>
        )}
        
        {/* Translating indicator */}
        {isTranslating && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 text-xs bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            <Languages className="h-3 w-3 mr-1 animate-spin" />
            Translating...
          </Badge>
        )}

        <p className="font-bold text-sm capitalize">{sender.replace('_', ' ')}</p>
        <p className="whitespace-pre-wrap">{textToDisplay}</p>
        <p className="text-xs opacity-70 mt-1 text-right">
          {new Date(timestamp).toLocaleTimeString()}
        </p>
        
        {isTranslated && (
          <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
            <Languages className="h-3 w-3" />
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs underline"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {toggleButtonText}
            </Button>
          </div>
        )}
      </div>
      
      {sender === currentUser && (
        <div className={`rounded-full p-2 ${getSenderColor()}`}>
          {sender === 'patient' ? <User className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-primary-foreground" />}
        </div>
      )}
    </div>
  );
}