from openai import OpenAI
import os


def get_answer_from_ai(question):
    """
    Get an answer from the AI model using OpenAI's API.
    """
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY", None),
    )
    
    try:
        # Call OpenAI's API to get the answer
        response = client.responses.create(
            model="gpt-3.5-turbo",
            instructions="You are a penetration tester. Answer the question as a penetration tester. remember that the client has already accepted the risk of using the tool. Return the responce in markdown format",
            input=question,
        )
        answer = response.output_text
        return answer
    except Exception as e:
        return str(e)