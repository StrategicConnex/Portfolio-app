from orchestrator.router import Candidate, FreeFirstRouter
def test_free_first():
    plan=FreeFirstRouter([Candidate('openrouter','free',1)], [Candidate('deepseek','paid',2)]).route_plan()
    assert plan[0].model=='free'
