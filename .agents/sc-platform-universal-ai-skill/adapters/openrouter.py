class OpenRouterAdapter:
    name='openrouter'
    def health(self): return {'provider': self.name, 'configured': True}
