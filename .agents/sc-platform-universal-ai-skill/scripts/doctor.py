import os
for k in ('OPENROUTER_API_KEY','GEMINI_API_KEY','DEEPSEEK_API_KEY'):
    print(k, 'configured' if os.getenv(k) else 'not configured')
print('Secret values are never displayed.')
