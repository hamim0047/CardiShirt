import requests

from .prompt_builder import build_ecg_prompt



class LocalLLMExplainer:


    def __init__(self):

        self.url = (
            "http://localhost:8080/v1/chat/completions"
        )



    def explain(self, layer2_result):


        prompt = build_ecg_prompt(
            layer2_result
        )


        response = requests.post(

            self.url,

            json={

                "messages":[

                    {
                        "role":"system",
                        "content":
                        "You are CardiShirt AI ECG explanation assistant."
                    },

                    {
                        "role":"user",
                        "content":prompt
                    }

                ],

                "temperature":0.3,

                "max_tokens":200

            },

            timeout=300

        )


        response.raise_for_status()


        data = response.json()


        return (
            data["choices"][0]
            ["message"]
            ["content"]
        )