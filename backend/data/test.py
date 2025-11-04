from pathlib import Path

txt_path = Path(__file__).parent / "vector_db" / "all_texts.txt"

with open(txt_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

filtered_lines = []
for line in lines:
    temiz = (
        line.replace("\u00A0", "") 
            .replace("\t", "")     
            .replace("\r", "")     
            .strip()              
    )
    if temiz == "" or (len(temiz) == 1 and temiz.isalpha()):
        continue

    filtered_lines.append(line)

with open(txt_path, "w", encoding="utf-8") as f:
    f.writelines(filtered_lines)

print("boş satırlar silindi.")
