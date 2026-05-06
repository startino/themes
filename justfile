default: build

# Generate palette.json and render every port
build: palette
    bun compiler/prism.ts --all

# Generate palette.json from generate.ts
palette:
    bun palette/generate.ts

# Verify every port's dist/ matches the template+palette
check:
    bun compiler/prism.ts --all --check

# Render a single port (e.g. `just port tmux`)
port name:
    bun compiler/prism.ts --port {{name}}

# Run unit tests
test:
    bun test

# Show the planet flavors and their anchor base hex
flavors:
    @bun -e 'const p = await Bun.file("palette/palette.json").json(); for (const k of Object.keys(p).filter(k => !k.startsWith("$") && k !== "version")) console.log(`  ${p[k].emoji}  ${p[k].name.padEnd(8)} ${p[k].colors.base.hex}`);'
