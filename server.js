import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hprzaainemafscshhrae.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_HTe88UpZw1waMTs9HfVugA_QW_feqgR';
const supabase = createClient(supabaseUrl, supabaseKey);

// GET all clients
app.get('/api/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ clients: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create client(s)
app.post('/api/clients', async (req, res) => {
  try {
    const body = req.body;
    
    // Bulk create
    if (Array.isArray(body?.clients)) {
      const clients = body.clients
        .map(entry => ({
          name: entry.name,
          phone: entry.phone || '',
          survey_status: entry.surveyStatus || 'Completed',
          action_status: entry.actionStatus || 'Pending Action',
          note: entry.note || '',
          reminder_type: entry.reminderType || '',
          reminder_date: entry.reminderDate || '',
          reminder_time: entry.reminderTime || ''
        }))
        .filter(c => c.name);
      
      if (clients.length === 0) {
        return res.status(400).json({ error: 'No valid records to import' });
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert(clients)
        .select();
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json({ clients: data || [] });
    }
    
    // Single create
    const client = {
      name: body.name,
      phone: body.phone || '',
      survey_status: body.surveyStatus || 'Completed',
      action_status: body.actionStatus || 'Pending Action',
      note: body.note || '',
      reminder_type: body.reminderType || '',
      reminder_date: body.reminderDate || '',
      reminder_time: body.reminderTime || ''
    };
    
    if (!client.name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({ client: data?.[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update client
app.patch('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.surveyStatus !== undefined) updateData.survey_status = body.surveyStatus;
    if (body.actionStatus !== undefined) updateData.action_status = body.actionStatus;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.reminderType !== undefined) updateData.reminder_type = body.reminderType;
    if (body.reminderDate !== undefined) updateData.reminder_date = body.reminderDate;
    if (body.reminderTime !== undefined) updateData.reminder_time = body.reminderTime;
    
    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({ error: 'No updatable fields provided' });
    }
    
    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ client: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE client(s)
app.delete('/api/clients/:id?', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      // Delete all
      const { error } = await supabase
        .from('clients')
        .delete()
        .neq('id', 0);
      
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      
      return res.json({ deleted: 'all' });
    }
    
    // Delete specific
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Supabase URL: ${supabaseUrl}`);
});
