# Gemini AI Integration Guide for CureCast

This guide explains how to set up and use the Gemini AI integration for the Chat Assistant feature in CureCast.

## Setup Instructions

1. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key if you don't already have one
   - Copy your API key

2. **Configure Environment Variables**:
   - Create or edit the `.env` file in the root of your project
   - Add your Gemini API key:
     ```
     REACT_APP_GEMINI_API_KEY=your_gemini_api_key
     ```
   - Restart your development server for the changes to take effect

3. **Advanced Setup (Optional - For Python Backend)**:
   If you want to use the Python script for the Chat Assistant:
   
   ```python
   # pip install google-genai
   
   import base64
   import os
   from google import genai
   from google.genai import types
   
   def generate():
       client = genai.Client(
           api_key=os.environ.get("GEMINI_API_KEY"),
       )
   
       model = "gemini-2.0-flash"
       contents = [
           types.Content(
               role="user",
               parts=[
                   types.Part.from_text(text="Your health question here"),
               ],
           ),
       ]
       generate_content_config = types.GenerateContentConfig(
           response_mime_type="text/plain",
       )
   
       for chunk in client.models.generate_content_stream(
           model=model,
           contents=contents,
           config=generate_content_config,
       ):
           print(chunk.text, end="")
   
   if __name__ == "__main__":
       generate()
   ```

## Usage Notes

### Fallback Mechanism
The Chat Assistant is designed with a fallback mechanism. If the Gemini API is unavailable or returns an error, the system will fall back to pre-defined responses based on keywords in the user's question.

### API Usage Limits
Be aware that Gemini API has usage limits:
- Free tier: Limited queries per minute
- Paid tier: Higher limits based on your plan

### Customization
You can customize the prompts sent to Gemini by editing the `text` field in the fetch request body in the `handleSendMessage` function in `src/components/ChatAssistant.tsx`:

```javascript
text: `You are a helpful healthcare assistant for an app called CureCast designed for rural communities in India. 
Answer the following health question in a helpful, accurate, and compassionate way: ${newMessage}`
```

## Further Improvements

1. **Backend Integration**: For production, consider moving the API calls to a backend service to keep your API keys secure
2. **Message History**: Enhance the assistant by providing conversation context/history to Gemini
3. **Localization**: Support for multiple languages for rural communities with different language preferences 