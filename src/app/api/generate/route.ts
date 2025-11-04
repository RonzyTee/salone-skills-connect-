// src/app/api/generate/route.ts

import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

// --- MAIN API HANDLER ---
export async function POST(req: NextRequest) {
  console.log("--- New API Request (Groq) ---");
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    console.error("🔴 GROQ_API_KEY environment variable is not set!");
    return NextResponse.json(
      { error: "Server configuration error: API key is missing." },
      { status: 500 }
    );
  }
  console.log("✅ GROQ_API_KEY loaded successfully.");

  try {
    const { task, payload } = await req.json();
    console.log(`Received task: [${task}] with payload:`, payload);

    if (!task || !payload) {
      return NextResponse.json(
        { error: "Missing task or payload in request body" },
        { status: 400 }
      );
    }
    
    // Initialize the Groq Client
    const groq = new Groq({ apiKey: groqApiKey });
    
    const { system_prompt, user_message } = await generateGroqPrompt(task, payload);

    console.log("Sending prompt to Groq...");
    // UPDATED MODEL NAME BELOW
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_message },
      ],
      model: "llama-3.3-70b-versatile", 
    });
    console.log("✅ Successfully received response from Groq.");

    const text = chatCompletion.choices[0]?.message?.content || "";
    return NextResponse.json({ success: true, data: text });

  } catch (error) {
    console.error("🔴 ERROR in Groq API route handler:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}

// --- HELPER FUNCTION TO GENERATE GROQ-SPECIFIC PROMPTS ---
async function generateGroqPrompt(task: string, payload: any): Promise<{ system_prompt: string; user_message: string; }> {
    const system_prompt = `You are an expert resume writer and career coach. Your goal is to help users create concise, powerful, and action-oriented resume content that is tailored to their target jobs. Always provide professional, high-quality, and specific advice.`;

    let user_message = "";

    switch (task) {
        case 'generate-summary': {
            const { jobTitles, skills } = payload;
            user_message = `Generate 3 distinct professional summary options for a resume. Each summary should be 3-4 sentences long. The user has held job titles like "${jobTitles.join(', ')}" and has skills in "${skills}". Frame the summaries to be compelling and concise.`;
            break;
        }
        case 'enhance-bullets': {
            const { jobTitle, bulletPoints } = payload;
            user_message = `Rewrite and enhance the following resume bullet points for a "${jobTitle}". Transform them to be action-oriented and quantifiable. Use the 'STAR' (Situation, Task, Action, Result) method where possible. Focus on achievements and impact, not just duties. Return only the rewritten list of bullet points.\n\nHere are the original points:\n---\n${bulletPoints}`;
            break;
        }
        case 'suggest-skills': {
            const { jobTitles } = payload;
            user_message = `Suggest a list of relevant skills for someone who has held job titles like "${jobTitles.join(', ')}". List 10-15 common and valuable skills, categorizing them into "Technical Skills" and "Soft Skills".`;
            break;
        }
        case 'tailor-resume': {
            const { resumeData, jobDescription } = payload;
            const resumeString = JSON.stringify(resumeData, null, 2);
            user_message = `Analyze the following resume and job description. Provide a list of 5 specific, actionable suggestions to make the resume a stronger fit for the job. For each suggestion, specify which section of the resume it applies to and provide a clear example.\n\nRESUME:\n---\n${resumeString}\n\nJOB DESCRIPTION:\n---\n${jobDescription}`;
            break;
        }
        default:
            throw new Error(`Unknown task: ${task}`);
    }

    return { system_prompt, user_message };
}