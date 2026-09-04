import os

from dotenv import load_dotenv

from groq import Groq

from .prompt_builder import build_ecg_prompt



# Load .env from src folder

load_dotenv(

    os.path.join(

        os.path.dirname(__file__),

        "..",

        ".env"

    )

)




class GroqECGExplainer:


    def __init__(self):


        api_key = os.getenv(

            "GROQ_API_KEY"

        )


        if not api_key:

            raise ValueError(

                "GROQ_API_KEY missing"

            )


        self.client = Groq(

            api_key=api_key

        )




    def explain(self, layer2_result):


        prompt = build_ecg_prompt(

            layer2_result

        )


        response = self.client.chat.completions.create(


            model="openai/gpt-oss-20b",


            messages=[


                {

                    "role": "system",

                    "content":

                    "You are CardiShirt AI ECG explanation assistant. "
                    "Explain ECG screening results clearly and safely."

                },


                {

                    "role": "user",

                    "content": prompt

                }

            ],


            temperature=0.3,


            max_tokens=80

        )


        return response.choices[0].message.content