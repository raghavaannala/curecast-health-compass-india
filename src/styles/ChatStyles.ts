import styled, { css, keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.6; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.2); }
  70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
  100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
`;

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(249,250,251,0.9) 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  position: relative;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    border-radius: 0;
    height: 100vh;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
    z-index: 1;
  }

  &:before {
    content: '';
    position: absolute;
    bottom: 70px;
    left: 0;
    right: 0;
    height: 80px;
    background: linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
    z-index: 1;
  }
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  justify-content: space-between;
  z-index: 10;

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-avatar {
    background: linear-gradient(135deg, #4f46e5, #8b5cf6);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
    font-size: 14px;
    margin-right: 8px;
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    background-color: #10b981;
    border-radius: 50%;
    margin-left: 8px;
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: #10b981;
      opacity: 0.4;
      animation: ${pulseGlow} 2s infinite;
    }
  }
`;

export const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(100, 116, 139, 0.2);
    border-radius: 20px;
  }

  @media (max-width: 768px) {
    padding: 16px 12px 100px;
  }
`;

export const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  max-width: 100%;
  animation: ${fadeIn} 0.3s ease forwards;
  position: relative;
  margin-bottom: 8px;
`;

export const MessageBubble = styled.div<{ isUser: boolean }>`
  position: relative;
  padding: 14px 18px;
  border-radius: 16px;
  max-width: 85%;
  font-size: 0.95rem;
  color: ${props => props.isUser ? '#ffffff' : '#1e293b'};
  line-height: 1.5;
  background: ${props => props.isUser ? 
    'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 
    'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'};
  box-shadow: ${props => props.isUser ? 
    '0 4px 12px rgba(99, 102, 241, 0.15)' : 
    '0 4px 12px rgba(148, 163, 184, 0.1)'};
  border: ${props => props.isUser ? 'none' : '1px solid rgba(226, 232, 240, 0.8)'};
  word-break: break-word;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.isUser ? 
      '0 6px 16px rgba(99, 102, 241, 0.2)' : 
      '0 6px 16px rgba(148, 163, 184, 0.15)'};
  }

  &:after {
    content: attr(data-time);
    position: absolute;
    bottom: -20px;
    ${props => props.isUser ? 'right: 0;' : 'left: 0;'}
    font-size: 0.7rem;
    color: #94a3b8;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    max-width: 90%;
    padding: 12px 16px;
    font-size: 0.9rem;
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  button {
    flex-shrink: 0;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(1px);
    }
  }

  .input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 24px;
    box-shadow: 0 2px 6px rgba(148, 163, 184, 0.1);
    overflow: hidden;
    transition: all 0.2s ease;

    &:focus-within {
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 12px 16px;
      font-size: 0.95rem;
      outline: none;
      color: #1e293b;

      &::placeholder {
        color: #94a3b8;
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      padding-right: 12px;
    }
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 8px;
    
    .input-wrapper input {
      padding: 10px 14px;
      font-size: 0.9rem;
    }
  }
`;

export const SendButton = styled.button<{ disabled: boolean }>`
  padding: 0 24px;
  height: 46px;
  border-radius: 25px;
  background: ${props => props.disabled ? 
    'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' : 
    'linear-gradient(135deg, #15803d 0%, #166534 100%)'};
  color: white;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  box-shadow: ${props => props.disabled ? 'none' : '0 2px 5px rgba(21, 128, 61, 0.3)'};

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(21, 128, 61, 0.4);
  }

  &:not(:disabled):active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(21, 128, 61, 0.3);
  }
`;

export const VoiceButton = styled.button<{ isRecording?: boolean }>`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isRecording ? 
    'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 
    'linear-gradient(135deg, #15803d 0%, #166534 100%)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: ${props => props.isRecording ? pulseAnimation : 'none'} 1.5s infinite;
  box-shadow: ${props => props.isRecording ? 
    '0 0 0 5px rgba(239, 68, 68, 0.2)' : 
    '0 2px 5px rgba(21, 128, 61, 0.3)'};

  &:hover {
    transform: ${props => props.isRecording ? 'scale(1.05)' : 'translateY(-2px)'};
    box-shadow: ${props => props.isRecording ? 
      '0 0 0 8px rgba(239, 68, 68, 0.2)' : 
      '0 4px 10px rgba(21, 128, 61, 0.4)'};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  
  .typing-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    background: #6366f1;
    animation: ${shimmer} 1.2s infinite linear;
    animation-delay: 0s;
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

export const SeverityIndicator = styled.div<{ severity?: string }>`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  
  ${props => {
    switch (props.severity) {
      case 'high':
        return css`
          background-color: #fee2e2;
          color: #b91c1c;
          border-left: 3px solid #ef4444;
        `;
      case 'medium':
        return css`
          background-color: #fef3c7;
          color: #b45309;
          border-left: 3px solid #f59e0b;
        `;
      default:
        return css`
          background-color: #d1fae5;
          color: #047857;
          border-left: 3px solid #10b981;
        `;
    }
  }}
`;

export const Recommendation = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(249, 250, 251, 0.8);
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 8px;
  font-size: 0.9rem;
  
  strong {
    color: #4f46e5;
    font-weight: 600;
  }
`;

export const SectionHighlight = styled.div<{ type: string }>`
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 0.95rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(148, 163, 184, 0.08);
  }
  
  ${props => {
    switch (props.type) {
      case 'consequences':
        return css`
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          h4 { color: #b91c1c; }
        `;
      case 'advice':
        return css`
          background: #f0f9ff;
          border-left: 3px solid #0ea5e9;
          h4 { color: #0369a1; }
        `;
      case 'detection':
        return css`
          background: #eef2ff;
          border-left: 3px solid #6366f1;
          h4 { color: #4338ca; }
        `;
      default:
        return css`
          background: #f8fafc;
          border-left: 3px solid #94a3b8;
          h4 { color: #475569; }
        `;
    }
  }}
`;

export const ImagePreview = styled.div`
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  max-width: 280px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  
  img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
  }
  
  &:before {
    content: 'Uploaded Image';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 6px 10px;
    background: rgba(0,0,0,0.5);
    color: white;
    font-size: 0.75rem;
    text-align: center;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, 
      rgba(0,0,0,0.2) 0%, 
      rgba(0,0,0,0) 20%, 
      rgba(0,0,0,0) 80%, 
      rgba(0,0,0,0.2) 100%
    );
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 4px;
  align-self: flex-end;
`;

export const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  
  .chip {
    padding: 6px 12px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 16px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background: #e2e8f0;
      transform: translateY(-2px);
    }
    
    &.active {
      background: #4f46e5;
      color: white;
      border-color: #4f46e5;
    }
  }
  
  @media (max-width: 768px) {
    .chip {
      padding: 4px 10px;
      font-size: 0.8rem;
    }
  }
`;

export const CategorySection = styled.div<{ categoryColor: string }>`
  margin-top: 16px;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  .category-header {
    padding: 10px 16px;
    background: ${props => props.categoryColor || '#6366f1'};
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    
    .icon-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .chevron {
      transition: transform 0.3s ease;
      
      &.open {
        transform: rotate(180deg);
      }
    }
  }
  
  .category-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    
    &.open {
      max-height: 500px;
      overflow-y: auto;
    }
    
    ul {
      margin: 0;
      padding: 12px 16px;
      list-style: none;
      background: white;
      border: 1px solid #e2e8f0;
      border-top: none;
      
      li {
        margin-bottom: 8px;
        padding-left: 16px;
        position: relative;
        font-size: 0.9rem;
        
        &:before {
          content: '•';
          position: absolute;
          left: 0;
          color: ${props => props.categoryColor || '#6366f1'};
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    .category-header {
      padding: 8px 12px;
      font-size: 0.85rem;
    }
  }
`;

// Responsive media queries
export const mediaQueries = {
  mobile: '@media (max-width: 640px)',
  tablet: '@media (min-width: 641px) and (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)'
}; 