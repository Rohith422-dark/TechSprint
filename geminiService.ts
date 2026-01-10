
import { GoogleGenAI, Type } from "@google/genai";
import { Domain, Skill, AnalysisResult, Resource, QuizQuestion, CareerCompassData } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIndustrySkills = async (domain: Domain, role: string): Promise<Skill[]> => {
  /* Using gemini-3-pro-preview for complex reasoning tasks */
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
    text: `Task: Compare the provided syllabus against these industry skills: [${skillsList}].

    Analysis Requirements:
    1. Identify matched, missing, and outdated skills.
    2. Provide a 'Curriculum Aging Index' (0-100).
    3. Generate data for a "Skill Density Heatmap". 
       Create a 4x4 matrix mapping 4 Skill Groups (e.g., 'Core Architecture', 'Implementation', 'Modern Tooling', 'Ethics/Security') 
       against 4 Complexity Levels ('Foundational', 'Intermediate', 'Advanced', 'Industry Ready'). 
       Each point should have a 'value' (0-100) representing how well the syllabus covers that intersection.`
  });

  /* Using gemini-3-pro-preview for complex content analysis and matrix generation */
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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
          explanation: { type: Type.STRING },
          heatmapData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.STRING },
                y: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ['x', 'y', 'value']
            }
          }
        },
        required: ['score', 'matchedSkills', 'missingSkills', 'outdatedTopics', 'breakdown', 'explanation', 'heatmapData']
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateDiagramImage = async (role: string, domain: string, matched: string[], missing: string[]): Promise<string> => {
  const prompt = `A professional technical diagram for a '${role}' career. Style: Clean architectural blueprint, dark navy and cyan accents.`;
  /* Correct model for image generation tasks */
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: prompt }] }],
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Failed to generate image.");
};

export const getRecommendations = async (missingSkills: string[]): Promise<Resource[]> => {
  /* gemini-3-flash-preview is suitable for basic list generation */
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest learning resources for: [${missingSkills.join(", ")}].`,
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
  /* Using gemini-3-pro-preview for higher quality assessment generation */
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate 3 MCQs for '${skill}'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
    }
  });
  return JSON.parse(response.text);
};

export const generateCareerCompass = async (domain: string, role: string): Promise<CareerCompassData> => {
  /* gemini-3-pro-preview for strategic roadmap and task generation */
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate roadmap, tasks, and assessment for '${role}' in '${domain}'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roadmap: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, duration: { type: Type.STRING } }, required: ['title', 'description', 'duration'] } },
          tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, difficulty: { type: Type.STRING } }, required: ['title', 'description', 'difficulty'] } },
          test: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.NUMBER }, explanation: { type: Type.STRING } }, required: ['question', 'options', 'correctAnswer', 'explanation'] } }
        },
        required: ['roadmap', 'tasks', 'test']
      }
    }
  });
  return JSON.parse(response.text);
};
