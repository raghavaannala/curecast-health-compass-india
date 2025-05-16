import styled, { keyframes } from 'styled-components';

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 80vh;
  max-width: 1000px;
  margin: 20px auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;

  @media (max-width: 768px) {
    height: 90vh;
    margin: 10px;
    border-radius: 15px;
  }
`;

export const Header = styled.div`
  background: linear-gradient(135deg, #15803d 0%, #166534 100%);
  color: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    margin: 5px 0 0;
    opacity: 0.9;
    font-size: 0.9rem;
  }
`;

export const MessageContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #15803d;
    border-radius: 4px;
  }
`;

export const Message = styled.div<{ isUser: boolean }>`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
  animation: ${fadeIn} 0.3s ease-out;
`;

export const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  padding: 12px 18px;
  border-radius: ${props => props.isUser ? '18px 18px 0 18px' : '18px 18px 18px 0'};
  background: ${props => props.isUser ? '#dcfce7' : 'white'};
  color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
  line-height: 1.5;
  border: 1px solid ${props => props.isUser ? '#bbf7d0' : '#e2e8f0'};

  @media (max-width: 768px) {
    max-width: 85%;
  }
`;

export const InputContainer = styled.form`
  display: flex;
  gap: 12px;
  padding: 20px;
  background: #f0fdf4;
  border-top: 1px solid #dcfce7;
  position: relative;
`;

export const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 25px;
  border: 1px solid #dcfce7;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:focus {
    border-color: #15803d;
    box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
`;

export const SendButton = styled.button<{ disabled: boolean }>`
  padding: 12px 24px;
  border-radius: 25px;
  background: ${props => props.disabled ? '#94a3b8' : '#15803d'};
  color: white;
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  &:not(:disabled):hover {
    background: #166534;
    transform: translateY(-1px);
  }

  &:not(:disabled):active {
    transform: translateY(0);
  }
`;

export const VoiceButton = styled.button<{ isRecording?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isRecording ? '#ef4444' : '#15803d'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${props => props.isRecording ? pulseAnimation : 'none'} 1.5s infinite;

  &:hover {
    transform: scale(1.05);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

export const TypingIndicator = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  margin-bottom: 16px;

  .dot {
    width: 8px;
    height: 8px;
    background: #15803d;
    border-radius: 50%;
    opacity: 0.6;
    animation: ${pulseAnimation} 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

export const SeverityIndicator = styled.div<{ severity: 'low' | 'medium' | 'high' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 8px;
  
  ${props => {
    switch (props.severity) {
      case 'low':
        return 'background: #dcfce7; color: #15803d;';
      case 'medium':
        return 'background: #fef9c3; color: #854d0e;';
      case 'high':
        return 'background: #fee2e2; color: #dc2626;';
    }
  }}
`;

export const Recommendation = styled.div`
  margin-top: 12px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
`; 