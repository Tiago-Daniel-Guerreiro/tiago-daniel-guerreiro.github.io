import re

# Ler o arquivo
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remover as linhas com "..."
pattern = r',\s*{\s*"order":\s*2,\s*"type":\s*"description",\s*"title":\s*"Objetivo Principal",\s*"content":\s*"\.\.\."\s*,\s*"showInModal":\s*true\s*}'
content = re.sub(pattern, '', content)

# Escrever de volta
with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Remoção concluída!")