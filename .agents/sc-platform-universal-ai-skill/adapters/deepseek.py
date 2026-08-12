class DeepSeekAdapter:
    name='deepseek'
    def health(self): return {'provider': self.name, 'configured': True}
