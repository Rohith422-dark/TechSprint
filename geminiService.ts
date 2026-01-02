
import { GoogleGenAI, Type } from "@google/genai";
import { Domain, Skill, AnalysisResult, Resource, QuizQuestion, CareerCompassData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIndustrySkills = async (domain: Domain, role: string): Promise<Skill[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `List the top 12 essential modern industry skills for a '${role}' in the '${domain}' domain.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            importance: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
            category: { type: Type.STRING }
          },
          required: ['id', 'name', 'description', 'importance', 'category']
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const analyzeSyllabus = async (
  content: { text?: string; file?: { data: string; mimeType: string } },
  industrySkills: Skill[]
): Promise<AnalysisResult> => {
  const skillsList = industrySkills.map(s => s.name).join(", ");
  
  const parts: any[] = [];
  
  if (content.text) {
    parts.push({ text: `Syllabus Content (Text):\n"${content.text}"` });
  }
  
  if (content.file) {
    parts.push({
      inlineData: {
        data: content.file.data,
        mimeType: content.file.mimeType
      }
    });
  }

  parts.push({
    text: `Task: Compare the provided syllabus (document or text) against these industry skills: [${skillsList}].

    Analysis Requirements:
    1. Identify which skills are matched (at least partially).
    2. Identify which skills are completely missing.
    3. Identify topics in the syllabus that are now outdated or obsolete in the current industry.
    4. Calculate a "Curriculum Aging Index" from 0 to 100 (where 0 is modern/perfectly aligned and 100 is severely outdated).
    5. Provide a breakdown for relevance, depth, and modernity scores (0-100).`
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          matchedSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
          outdatedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          breakdown: {
            type: Type.OBJECT,
            properties: {
              relevance: { type: Type.NUMBER },
              depth: { type: Type.NUMBER },
              modernity: { type: Type.NUMBER }
            },
            required: ['relevance', 'depth', 'modernity']
          },
          explanation: { type: Type.STRING }
        },
        required: ['score', 'matchedSkills', 'missingSkills', 'outdatedTopics', 'breakdown', 'explanation']
      }
    }
  });

  return JSON.parse(response.text);
};

export const getRecommendations = async (missingSkills: string[]): Promise<Resource[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest high-quality learning resources (courses, documentation, or articles) for the following missing industry skills: [${missingSkills.join(", ")}]. Provide at least one resource per skill.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            level: { type: Type.STRING, enum: ['beginner', 'intermediate', 'advanced'] },
            type: { type: Type.STRING }
          },
          required: ['title', 'url', 'level', 'type']
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateQuiz = async (skill: string): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 3 multiple-choice questions to validate knowledge in '${skill}'. Include explanations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.NUMBER, description: 'Index of the correct option' },
            explanation: { type: Type.STRING }
          },
          required: ['question', 'options', 'correctAnswer', 'explanation']
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateCareerCompass = async (domain: string, role: string): Promise<CareerCompassData> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a career compass for a person aspiring to be a '${role}' in the '${domain}' stream. 
    Include:
    1. A detailed learning roadmap (steps/milestones).
    2. Practical tasks or projects to undertake.
    3. A multi-question test (assessment) to gauge initial readiness.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                duration: { type: Type.STRING }
              },
              required: ['title', 'description', 'duration']
            }
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                difficulty: { type: Type.STRING }
              },
              required: ['title', 'description', 'difficulty']
            }
          },
          test: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ['question', 'options', 'correctAnswer', 'explanation']
            }
          }
        },
        required: ['roadmap', 'tasks', 'test']
      }
    }
  });

  return JSON.parse(response.text);
};
