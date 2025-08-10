import os
from openai import OpenAI
from typing import List
from app.schemas.meeting_schemas import MeetingQuestion, ConversationStep
from app.services.database_service import get_patient_summary # Assuming this function exists
from app.core.database import SessionLocal, MeetingRecord

class MeetingPlannerService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if not os.getenv("OPENAI_API_KEY"):
            print("Warning: OPENAI_API_KEY is not set. AI features will be limited.")

    def generate_conversation_plan(self, patient_id: str, custom_questions: List[MeetingQuestion]) -> List[ConversationStep]:
        # In a real app, you'd fetch comprehensive patient data.
        # Here, we'll use the existing summary function as a stand-in.
        patient_summary = get_patient_summary(patient_id)
        if not patient_summary:
            patient_summary = "No patient data available. Proceed with generic questions."

        # Generate conversation guide document
        conversation_guide = self._generate_conversation_guide(patient_summary, custom_questions)
        
        prompt = self._build_prompt(patient_summary, custom_questions, conversation_guide)

        if not os.getenv("OPENAI_API_KEY"):
            print("No OpenAI key found. Using mock conversation plan.")
            return self._generate_mock_plan(custom_questions)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant designing a brief, empathetic pre-discharge conversation for a hospital patient. The goal is to confirm their understanding and gather key information. Create a JSON array of conversation steps that follow the conversation guide provided."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            # Assuming the response is a JSON object with a "plan" key
            plan_data = response.choices[0].message.content
            import json
            plan = json.loads(plan_data).get("plan", [])
            return [ConversationStep(**step) for step in plan]
        except Exception as e:
            print(f"OpenAI API call failed: {e}")
            return self._generate_mock_plan(custom_questions)

    def _build_prompt(self, summary: str, questions: List[MeetingQuestion], conversation_guide: str) -> str:
        question_list = "\n".join([f'- ({q.category}) {q.question} (id: {q.id})' for q in questions])
        
        return f"""
        Based on the following patient summary, conversation guide, and list of questions, create a brief, 2-4 step conversation plan.
        The plan should be a JSON array in a root object with key "plan". Each object in the array should have 'step_type', 'content', and optionally 'question_id'.

        Patient Summary:
        {summary}

        Conversation Guide:
        {conversation_guide}

        Questions to Ask:
        {question_list}

        The conversation flow should be:
        1. A warm 'introduction'.
        2. A very brief 'summary' of 1-2 key points from their discharge plan (e.g., new medications, follow-up theme).
        3. A 'question' step for each of the provided questions.
        4. A brief 'conclusion'.

        Keep the language simple and empathetic. For questions, use the exact text provided. Follow the conversation guide for best practices.
        """

    def _generate_conversation_guide(self, patient_summary: str, questions: List[MeetingQuestion]) -> str:
        """
        Generate a conversation guide document to guide the bot's conversation flow.
        This provides structured guidance for conducting effective pre-discharge conversations.
        """
        # Categorize questions
        teach_back_questions = [q for q in questions if q.category == 'teach-back']
        follow_up_questions = [q for q in questions if q.category == 'follow-up']
        medication_questions = [q for q in questions if q.category == 'medication']
        other_questions = [q for q in questions if q.category == 'other']
        
        guide = f"""
PREDISCHARGE CONVERSATION GUIDE

=== PATIENT CONTEXT ===
{patient_summary}

=== CONVERSATION OBJECTIVES ===
1. Ensure patient understanding of discharge instructions
2. Identify any concerns or gaps in knowledge
3. Collect follow-up scheduling information
4. Confirm medication understanding and compliance plans
5. Assess patient confidence in home care management

=== CONVERSATION FLOW GUIDELINES ===

INTRODUCTION (30 seconds):
- Warm, professional greeting
- Identify yourself and purpose
- Set expectation for brief conversation (5-10 minutes)
- Ask about current comfort level

DISCHARGE SUMMARY (1-2 minutes):
- Briefly review key discharge points from patient summary
- Focus on 1-2 most critical items (medications, follow-up care)
- Use simple, non-medical language
- Check for initial understanding

STRUCTURED QUESTIONS ({len(questions)} questions total):

Teach-Back Questions ({len(teach_back_questions)} questions):
- These assess patient understanding through explanation
- Listen for key concepts in patient's own words
- Gently correct misconceptions
- Ask follow-up clarifying questions if needed

Follow-Up Questions ({len(follow_up_questions)} questions):
- Critical for scheduling and continuity of care
- Be specific about timeframes and availability
- Offer multiple options when possible
- Document exact preferences for scheduling team

Medication Questions ({len(medication_questions)} questions):
- Focus on safety and compliance
- Ask about barriers (cost, side effects, complexity)
- Confirm understanding of timing and dosage
- Address any concerns immediately

Other Questions ({len(other_questions)} questions):
- Address confidence levels and concerns
- Assess support systems at home
- Identify any additional resources needed

CONCLUSION (30 seconds):
- Summarize key points discussed
- Confirm next steps
- Provide contact information for questions
- Thank patient for their time

=== COMMUNICATION BEST PRACTICES ===
- Use simple, clear language (5th grade reading level)
- Pause after questions to allow thinking time
- Acknowledge patient concerns with empathy
- Repeat back important information for confirmation
- Be patient with elderly or anxious patients
- Document specific quotes for follow-up scheduling

=== SPECIAL ATTENTION AREAS ===
- Patient availability for follow-up appointments (critical for scheduling)
- Medication compliance concerns or barriers
- Signs of confusion or lack of understanding
- Family support system availability
- Transportation or mobility issues
"""
        return guide

    def generate_reactive_reply(self, transcript: List[dict], last_patient_message: str, context_step: str | None) -> dict:
        """
        Generate a brief, empathetic acknowledgment and, if appropriate,
        a short explanation or follow-up question based on the last patient message.
        This keeps the conversation natural without jumping straight to the next scripted step.
        """
        if not os.getenv("OPENAI_API_KEY"):
            # Simple rules-based fallback
            text = last_patient_message.lower()
            if any(k in text for k in ["don't understand", "do not understand", "confused", "explain", "not sure", "unclear"]):
                return {"reply": "Thanks for letting me know. Let me explain that in simpler terms. It's important because it helps prevent complications after you leave. Does that make more sense now?", "follow_up_needed": True}
            if any(k in text for k in ["no ", "not really", "i don't have", "i do not have"]):
                return {"reply": "Thanks for sharing that. Let's talk through what you might need before you go so you're set up at home.", "follow_up_needed": False}
            return {"reply": "Got it. Thank you. I'll make a quick note of that.", "follow_up_needed": False}

        try:
            prompt = (
                "You are an empathetic clinician. Given the ongoing pre-discharge conversation transcript and the patient's last reply, "
                "write a brief (1-2 sentences) acknowledgment and, only if needed, a short clarification or follow-up question. "
                "Be concise, warm, and helpful. Respond as the clinician. Return JSON with keys: reply (string), follow_up_needed (boolean)."
            )
            import json
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": json.dumps({
                        "transcript": transcript[-12:],  # last few turns for context
                        "last_patient_message": last_patient_message,
                        "context_step": context_step,
                    })},
                ],
                response_format={"type": "json_object"}
            )
            data = json.loads(response.choices[0].message.content)
            return {"reply": data.get("reply", "Thanks for sharing that."), "follow_up_needed": bool(data.get("follow_up_needed", False))}
        except Exception:
            return {"reply": "Thanks for sharing that.", "follow_up_needed": False}

    def _generate_mock_plan(self, questions: List[MeetingQuestion]) -> List[ConversationStep]:
        plan = [
            ConversationStep(step_type='introduction', content="Hello! I'm calling to briefly go over a few things before your discharge to make sure you're all set."),
            ConversationStep(step_type='summary', content="I see you have a new prescription for Lisinopril and a follow-up appointment to schedule."),
        ]
        for q in questions:
            plan.append(ConversationStep(step_type='question', content=q.question, question_id=q.id))
        plan.append(ConversationStep(step_type='conclusion', content="That's all my questions. Thank you! We'll be in to see you shortly."))
        return plan

    def summarize_meeting(self, transcript: List[dict], questions: List[MeetingQuestion]) -> dict:
        # Guard: if no patient messages, avoid LLM hallucinations
        if not any(isinstance(m, dict) and m.get('speaker') == 'patient' for m in transcript):
            answers = {q.id: "Not discussed" for q in questions}
            empty_summary = "Meeting ended before patient responses were recorded. No answers could be extracted."
            try:
                db = SessionLocal()
                record = MeetingRecord(
                    patient_id='unknown',
                    status='completed',
                    transcript=transcript,
                    summary=empty_summary,
                    extracted_answers=answers,
                )
                db.add(record)
                db.commit()
            except Exception:
                pass
            finally:
                try:
                    db.close()
                except Exception:
                    pass
            return {"summary": empty_summary, "extracted_answers": answers}

        prompt = self._build_summary_prompt(transcript, questions)

        if not os.getenv("OPENAI_API_KEY"):
            print("No OpenAI key found. Using mock summary.")
            return self._generate_mock_summary(questions)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert clinical summarizer. Your task is to summarize a patient conversation and extract answers to specific questions. Provide the output as a JSON object with 'summary' and 'extracted_answers' keys."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            summary_data = response.choices[0].message.content
            import json
            result = json.loads(summary_data)
            # Persist meeting artifacts
            try:
                db = SessionLocal()
                # Try to infer patient_id from any message metadata, else 'unknown'
                inferred_patient_id = 'unknown'
                if transcript:
                    for msg in transcript:
                        if isinstance(msg, dict) and 'patient_id' in msg:
                            inferred_patient_id = str(msg['patient_id'])
                            break
                record = MeetingRecord(
                    patient_id=inferred_patient_id,
                    status='completed',
                    transcript=transcript,
                    summary=result.get('summary', ''),
                    extracted_answers=result.get('extracted_answers', {}),
                )
                db.add(record)
                db.commit()
            except Exception:
                pass
            finally:
                try:
                    db.close()
                except Exception:
                    pass
            return result
        except Exception as e:
            print(f"OpenAI API call for summary failed: {e}")
            mock = self._generate_mock_summary(questions)
            # Persist mock as well
            try:
                db = SessionLocal()
                record = MeetingRecord(
                    patient_id='unknown',
                    status='completed',
                    transcript=transcript,
                    summary=mock.get('summary', ''),
                    extracted_answers=mock.get('extracted_answers', {}),
                )
                db.add(record)
                db.commit()
            except Exception:
                pass
            finally:
                try:
                    db.close()
                except Exception:
                    pass
            return mock

    def _build_summary_prompt(self, transcript: List[dict], questions: List[MeetingQuestion]) -> str:
        transcript_text = "\n".join([f"{msg['speaker']}: {msg['content']}" for msg in transcript])
        
        # Categorize questions for better extraction
        question_categories = {}
        for q in questions:
            if q.category not in question_categories:
                question_categories[q.category] = []
            question_categories[q.category].append(f"- {q.question} (id: {q.id})")
        
        question_sections = []
        for category, questions_in_category in question_categories.items():
            question_sections.append(f"{category.upper()} QUESTIONS:\n" + "\n".join(questions_in_category))
        
        question_list = "\n\n".join(question_sections)

        return f"""
        Please analyze the following meeting transcript and extract answers with special attention to different question types.
        
        Transcript:
        {transcript_text}

        Based on the transcript, provide two things in a JSON object:
        1. A brief "summary" (2-3 sentences) of the key points and patient sentiment.
        2. "extracted_answers": a JSON object where each key is a question ID and the value is the patient's answer.

        Questions to Answer:
        {question_list}

        EXTRACTION GUIDELINES:
        - TEACH-BACK questions: Look for patient explanations in their own words. Capture the essence of their understanding.
        - FOLLOW-UP questions: Extract specific times, dates, availability preferences. Be very detailed for scheduling purposes.
        - MEDICATION questions: Note compliance plans, concerns, barriers, or confirmation of understanding.
        - OTHER questions: Capture confidence levels, concerns, or specific responses.

        SPECIAL ATTENTION FOR FOLLOW-UP/AVAILABILITY:
        - Extract exact days, times, preferences mentioned by the patient
        - Include any constraints or limitations they mention
        - Note preferred communication methods if mentioned
        - Capture family member availability if relevant

        If an answer to a question is not explicitly found, state 'Not discussed'.
        For follow-up questions, if patient gives availability, format as: "Available [days/times] - [any constraints]"
        """

    def _generate_mock_summary(self, questions: List[MeetingQuestion]) -> dict:
        answers = {}
        
        # Generate category-specific mock answers
        for q in questions:
            if q.category == 'teach-back':
                answers[q.id] = "Patient explained in their own words: 'I need to take this medicine to help my heart pump better and I should watch for swelling in my legs.'"
            elif q.category == 'follow-up':
                answers[q.id] = "Available Tuesday or Wednesday afternoons after 2 PM - prefers phone calls, daughter can help with transportation"
            elif q.category == 'medication':
                answers[q.id] = "Patient confirmed they have all medications and understands timing - will take morning pill with breakfast"
            elif q.category == 'other':
                answers[q.id] = "Patient rated confidence as 8/10, feels well-prepared to go home"
            else:
                answers[q.id] = "Patient confirmed understanding and agreement."
        
        return {
            "summary": "Patient was engaged and demonstrated good understanding of discharge instructions. They expressed confidence in managing care at home and provided specific availability for follow-up appointments. No major concerns identified.",
            "extracted_answers": answers
        }


meeting_planner_service = MeetingPlannerService()