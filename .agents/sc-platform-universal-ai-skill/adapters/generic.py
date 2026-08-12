class GenericAdapter:
    name='generic'
    def health(self): return {'provider': self.name, 'configured': True}
