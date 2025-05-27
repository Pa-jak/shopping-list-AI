const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Połączono z MongoDB"))
  .catch(err => console.error("❌ Błąd MongoDB:", err));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔗 Połączenie z MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Połączono z MongoDB"))
  .catch(err => console.error("❌ Błąd MongoDB:", err));

// 📦 Schemat i model listy
const ListaSchema = new mongoose.Schema({
  listId: String,
  items: [
    {
      name: String,
      category: String,
      packed: Boolean
    }
  ]
});
const Lista = mongoose.model('Lista', ListaSchema);

// 🔍 Pobieranie listy
app.get('/lista/:id', async (req, res) => {
  const { id } = req.params;
  let lista = await Lista.findOne({ listId: id });
  if (!lista) {
    lista = await Lista.create({ listId: id, items: [] });
  }
  res.json(lista.items);
});

// ➕ Dodawanie produktu
app.post('/lista/:id/dodaj', async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  const lista = await Lista.findOneAndUpdate(
    { listId: id },
    { $push: { items: { name, category, packed: false } } },
    { new: true, upsert: true }
  );
  res.json(lista.items);
});

// ✅ Oznaczanie jako spakowany
app.post('/lista/:id/oznacz', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const lista = await Lista.findOne({ listId: id });
  if (!lista) return res.status(404).json({ error: "Lista nie istnieje" });

  lista.items = lista.items.map(item =>
    item.name === name ? { ...item.toObject(), packed: !item.packed } : item
  );
  await lista.save();

  res.json(lista.items);
});

// 🧹 Usuwanie spakowanych
app.post('/lista/:id/wyczysc', async (req, res) => {
  const { id } = req.params;

  const lista = await Lista.findOneAndUpdate(
    { listId: id },
    { $pull: { items: { packed: true } } },
    { new: true }
  );
  res.json(lista.items);
});

// 🧠 (Opcjonalnie) kategoryzacja przez OpenAI
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/kategoria', async (req, res) => {
  const { produkt } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `Przypisz produkt do jednej z kategorii: Owoce, Warzywa, Nabiał, Mięso, Pieczywo, Chemia, Mrożonki, Inne. Odpowiedz tylko nazwą kategorii.`
        },
        { role: 'user', content: produkt }
      ],
      temperature: 0
    });

    const kategoria = response.choices[0].message.content.trim();
    res.json({ kategoria });

  } catch (err) {
    console.error("❌ Błąd kategorii:", err);
    res.status(500).json({ error: "Nie udało się uzyskać kategorii." });
  }
});

// 🔄 Start serwera
app.listen(PORT, () => {
  console.log(`🚀 Serwer działa na porcie ${PORT}`);
});


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
   console.log('Otrzymano produkt:', produkt);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'dostajesz nazwę produktu, twoim zadaniem jest przyporządkować go do kategorii która pojawi się na liście zakupów. Zwróć tylko nazwę kategorii.',
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
