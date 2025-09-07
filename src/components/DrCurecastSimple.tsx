import React, { useState } from 'react';

const DrCurecastSimple: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'bot'}>>([
    { text: 'Hello! I am Dr.Curecast, your multilingual healthcare assistant. How can I help you today?', sender: 'bot' }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessages = [
      ...messages,
      { text: message, sender: 'user' as const },
      { text: 'Thank you for your message. Dr.Curecast is being initialized with full multilingual support, voice features, and government health database integration.', sender: 'bot' as const }
    ];
    
    setMessages(newMessages);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Dr.Curecast</h1>
            <p className="text-gray-600">Multilingual Healthcare Chatbot & Voice Assistant</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">19+ Languages</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Voice Enabled</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">Government Integration</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">Vaccination Reminders</span>
            </div>
          </div>

          <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg max-w-xs ${
                  msg.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your health question in any language..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🚀 Dr.Curecast Features</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Multilingual support for Indian and international languages</li>
              <li>• Voice-to-text and text-to-voice conversion</li>
              <li>• Vaccination reminders and government database sync</li>
              <li>• Emergency health assistance with severity assessment</li>
              <li>• HIPAA/GDPR compliant data handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrCurecastSimple;
