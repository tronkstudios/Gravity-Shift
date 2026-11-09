"""Build a source download without Git internals, dependencies or credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root / 'dist' / 'gravity-shift-source.zip'
output.parent.mkdir(exist_ok=True)
paths = ['src', 'scripts', 'tests', 'docs', '.github', 'styles.css', 'README.md', 'package.json', 'package-lock.json', 'tailwind.config.cjs', '.gitignore']
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for name in paths:
        path = root / name
        for file in sorted(path.rglob('*')) if path.is_dir() else [path]:
            if file.is_file():
                archive.write(file, 'gravity-shift/' + file.relative_to(root).as_posix())
print('Created dist/gravity-shift-source.zip')
