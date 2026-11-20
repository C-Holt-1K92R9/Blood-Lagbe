# Blood Lagbe

Find blood donors near you in minutes. Blood Lagbe connects families in an emergency with registered, available blood donors across Bangladesh. Always free for seekers.

Built with React 19, Vite, Tailwind CSS and Phosphor icons. Sample prototype data; not yet wired to a backend.

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing page (emergency focused) |
| `/find` | Search available donors by blood group, component and radius |
| `/register` | Become a donor |
| `/privacy`, `/terms` | Legal |
| `*` | 404 |

## Develop

```bash
npm install
npm run dev      # start dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
```

## Notes

- Context: Dhaka, Bangladesh. Ambulance line: 999.
- Data layer is stubbed with fictional sample donors (Dhaka neighbourhoods); Supabase integration is the planned next step.
- The `DonorMap` component uses a stylized SVG map. Swap in Google Maps JavaScript API when a key is available.
- Theme (dark/light) persists in `localStorage` under `bl-theme`.
