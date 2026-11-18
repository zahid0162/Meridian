import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  generateCareerAssessment,
  generateFuturePrediction,
  getAIProviderStatus,
} from './server/ai/engine.ts';
import type { AIModelId } from './server/ai/types.ts';
import type { PersonalProfile, CareerAssessment, PredictionCategoryId } from './src/types/intelligence.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/ai/models', (_req, res) => {
    res.json(getAIProviderStatus());
  });

  app.post('/api/ai/career-assessment', async (req, res) => {
    try {
      const body = req.body as {
        profile?: PersonalProfile;
        preferredModel?: AIModelId;
        previousAssessment?: CareerAssessment | null;
      };

      if (!body?.profile?.basic?.name) {
        res.status(400).json({ error: 'A valid personal profile is required.' });
        return;
      }

      const assessment = await generateCareerAssessment({
        profile: body.profile,
        preferredModel: body.preferredModel || 'Qwen/Qwen3-8B',
        previousAssessment: body.previousAssessment || null,
      });

      res.json({ assessment });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Career assessment generation failed.';
      console.error('Career assessment error:', message);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/future-prediction', async (req, res) => {
    try {
      const body = req.body as {
        category?: PredictionCategoryId;
        subjectTitle?: string;
        country?: string;
        city?: string;
        focusSector?: string;
        inputContext?: string;
        linkedProfile?: PersonalProfile | null;
        preferredModel?: AIModelId;
      };

      if (!body?.category || !body?.subjectTitle) {
        res.status(400).json({ error: 'Category and subject title are required.' });
        return;
      }

      const prediction = await generateFuturePrediction({
        category: body.category,
        subjectTitle: body.subjectTitle,
        country: body.country || '',
        city: body.city || '',
        focusSector: body.focusSector || '',
        inputContext: body.inputContext || '',
        linkedProfile: body.linkedProfile || null,
        preferredModel: body.preferredModel || 'Qwen/Qwen3-8B',
      });

      res.json({ prediction });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Future prediction generation failed.';
      console.error('Future prediction error:', message);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Meridian server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Meridian server:', err);
  process.exit(1);
});
