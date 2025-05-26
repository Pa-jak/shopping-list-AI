require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/kategoria', async (req, res) => {
  const { produkt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Przypisuj produkty spożywcze do jednej z kategorii: Owoce, Warzywa, Nabiał, Mięso, Pieczywo, Chemia, Mrożonki, Inne. Zwróć tylko nazwę kategorii.',
        },
        {
          role: 'user',
          content: produkt,
        }
      ],
      temperature: 0,
    });

    const kategoria = response.choices[0].message.content.trim();
    res.json({ kategoria });

  } catch (err) {
    console.error('Błąd:', err);
    res.status(500).json({ error: 'Wystąpił błąd podczas uzyskiwania kategorii.' });
  }
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
