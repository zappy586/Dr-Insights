from openai import OpenAI
from dotenv import load_dotenv
import base64
load_dotenv()
client = OpenAI()

tools = [
  {
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA",
          },
          "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
        },
        "required": ["location"],
      },
    }
  }
]




def encode_image(image_path):
  with open(image_path, "rb") as image_file:
    return base64.b64encode(image_file.read()).decode('utf-8')

# Path to your image
image_path = "person100_bacteria_475.jpeg"

# Getting the base64 string
base64_image = encode_image(image_path)

response = client.chat.completions.create(
  model="gpt-4-vision-preview",
  messages=[
    {"role": "system", "content": "You are a X-ray analyzer which gives detailed analysis of X-ray pictures including small details. Mention the details point-wise. Give a possible inference of disease if you see anything."},
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Does it look like the patient has any disease? if so which one do you think?"},
        {
          "type": "image_url",
          "image_url": {
            "url": f"data:image/jpeg;base64,{base64_image}",
            "detail": "high"
          },
        },
      ],
    }
  ],
  max_tokens=512,
  stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")