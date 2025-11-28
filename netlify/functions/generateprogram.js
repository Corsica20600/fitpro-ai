export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const {
      gender,
      age,
      weight,
      goal,
      level,
      sessionsPerWeek,
      equipment
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OPENAI_API_KEY manquante sur Netlify"
        })
      };
    }

    const prompt = `
Tu es un coach sportif.
Crée un programme d'entraînement personnalisé en JSON STRICT.

Profil :
- Sexe : ${gender}
- Âge : ${age}
- Poids : ${weight}
- Objectif : ${goal}
- Niveau : ${level}
- Séances/semaine : ${sessionsPerWeek}
- Matériel : ${equipment}

Réponds UNIQUEMENT en JSON, sans texte autour :

{
  "goal": "texte",
  "level": "texte",
  "days": [
    {
      "name": "Jour 1 - ...",
      "description": "texte",
      "exercises": [
        { "name": "...", "muscle": "...", "sets": 4, "reps": "8-10", "rest": 90 }
      ]
    }
  ]
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Tu es un coach sportif expert." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Erreur OpenAI",
          details: errText
        })
      };
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Réponse OpenAI vide ou invalide",
          raw: data
        })
      };
    }

    const content = data.choices[0].message.content;

    let program;
    try {
      program = JSON.parse(content);
    } catch (e) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OpenAI n’a pas renvoyé du JSON valide",
          raw: content
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(program)
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur serveur",
        message: e.message
      })
    };
  }
}
