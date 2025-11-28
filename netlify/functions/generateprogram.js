// netlify/functions/generateprogram.js

export async function handler(event) {
  // On n'accepte que le POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OPENAI_API_KEY manquante sur Netlify",
        }),
      };
    }

    const {
      gender = "homme",
      age = 30,
      weight = 80,
      goal = "prise de masse",
      level = "intermédiaire",
      sessionsPerWeek = 3,
      focus = "équilibré",
      equipment = "machines + haltères",
    } = body;

    const prompt = `
Génère un programme d'entraînement structuré au format JSON STRICT pour un utilisateur :
- sexe : ${gender}
- âge : ${age}
- poids : ${weight} kg
- objectif : ${goal}
- niveau : ${level}
- séances par semaine : ${sessionsPerWeek}
- focus : ${focus}
- matériel : ${equipment}

Le JSON doit avoir la forme :

{
  "goal": "...",
  "level": "...",
  "sessionsPerWeek": 3,
  "days": [
    {
      "name": "Jour 1 – Haut du corps",
      "focus": "pectoraux / triceps",
      "exercises": [
        {
          "group": "pectoraux",
          "name": "Développé couché barre",
          "sets": 4,
          "reps": "6-8",
          "rest": 120
        }
      ]
    }
  ]
}

Respecte STRICTEMENT ce format JSON (guillemets doubles, aucune virgule en trop, aucun texte en dehors du JSON).
    `.trim();

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content:
                "Tu es un coach sportif expert. Tu dois répondre STRICTEMENT en JSON valide, " +
                "sans phrase autour, sans markdown, sans commentaires.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          // On demande explicitement un JSON
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Erreur OpenAI",
          details: errText,
        }),
      };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "";

    // On essaie de parser en JSON. Si ça échoue, on renvoie quand même le texte brut
    let program;
    try {
      program = JSON.parse(content);
    } catch (e) {
      // Pas de crash : on renvoie juste le texte brut
      return {
        statusCode: 200,
        body: JSON.stringify({
          raw: content,
        }),
      };
    }

    // JSON OK
    return {
      statusCode: 200,
      body: JSON.stringify(program),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur serveur",
        message: e.message,
      }),
    };
  }
}
