import os

from google import genai

from dotenv import load_dotenv

from .prompt_builder import build_ecg_prompt



# Load .env from src folder

load_dotenv(

    os.path.join(

        os.path.dirname(__file__),

        "..",

        ".env"

    )

)



class GeminiECGExplainer:


    def __init__(self):


        api_key = os.getenv(
            "GEMINI_API_KEY"
        )


        if not api_key:

            raise ValueError(
                "GEMINI_API_KEY missing"
            )


        self.client = genai.Client(
            api_key=api_key
        )


        self.model = "gemini-3.6-flash"



    def explain(self, layer2_result):


        try:


            prompt = build_ecg_prompt(
                layer2_result
            )


            response = self.client.models.generate_content(

                model=self.model,

                contents=prompt

            )


            return response.text



        except Exception as e:


            print(
                "Gemini failed:"
            )

            print(e)


            return None