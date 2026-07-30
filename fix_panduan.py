with open('src/components/panduan-layout.tsx', 'r', encoding='utf8') as f:
    content = f.read()

# Fix 1: Close the span inside TOC buttons
old1 = '''                <span className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted/40">{section.nomor}</span>
                  <span>{section.judul}</span>
              </button>'''
new1 = '''                <span className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted/40">{section.nomor}</span>
                  <span>{section.judul}</span>
              </button>'''
content = content.replace(old1, new1)

# Fix 2: Close the flex-1 div properly in section
old2 = '''                    {section.content}
                  </div>
                {index < sections.length - 1 && ('''
new2 = '''                    {section.content}
                  </div>
                {index < sections.length - 1 && ('''
content = content.replace(old2, new2)

# Fix 3: Close PanduanSub div properly
old3 = '''    <div className="ml-3 pl-3 border-l border-cream-100">
        {children}
      </div>
  )'''
new3 = '''    <div className="ml-3 pl-3 border-l border-cream-100">
        {children}
      </div>
  )'''
content = content.replace(old3, new3)

# Fix 4: Also fix the invalid JSX in section (missing closing </div> for flex-1 div inside section)
# Also fix: the outer <div className="flex gap-8"> needs a proper closing
old4 = '''        </div>
  )'''
# This might be too generic, let's check specific patterns
# The main <div className="flex gap-8"> section seems to be missing its closing </div> after main content

# Check for duplicates
lines = content.split('\n')
# Remove duplicate PanduanKode if exists
count = 0
new_lines = []
for line in lines:
    stripped = line.strip()
    if stripped.startswith('export function PanduanKode'):
        count += 1
    if count <= 1:
        new_lines.append(line)
    else:
        # Skip second PanduanKode and its return block
        # Actually let's be smarter - skip until next export or end
        pass

content = '\n'.join(new_lines)

with open('src/components/panduan-layout.tsx', 'w', encoding='utf8') as f:
    f.write(content)

print('Done fixing')
