class GeminiAdapter:
    name='gemini'
    def health(self): return {'provider': self.name, 'configured': True}
