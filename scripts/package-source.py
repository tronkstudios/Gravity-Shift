"""Package tracked and non-ignored sources, excluding Site identity and generated state."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
root=Path(__file__).resolve().parents[1]
output=root/'dist'/'gravity-shift-source.zip'
output.parent.mkdir(exist_ok=True)
result=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root)
files=sorted(set(result.decode().split('\0'))-set(['']))
with ZipFile(output,'w',ZIP_DEFLATED) as archive:
    for name in files:
        file=root/name
        if name.startswith(('.openai/','dist/','node_modules/')) or not file.is_file():
            continue
        archive.write(file,'gravity-shift/'+name)
print('Created dist/gravity-shift-source.zip')
