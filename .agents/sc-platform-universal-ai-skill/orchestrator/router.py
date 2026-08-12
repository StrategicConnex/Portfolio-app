from dataclasses import dataclass
@dataclass
class Candidate:
    provider: str
    model: str
    score: float = 0.0
class FreeFirstRouter:
    def __init__(self, free, paid):
        self.free, self.paid = free, paid
    def route_plan(self):
        return sorted(self.free, key=lambda x: x.score, reverse=True) + self.paid
