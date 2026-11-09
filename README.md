# Uppersixth Memories

A dark, responsive public memory archive built with React, Vite and Supabase.

## Features
- Public gallery for published photos and videos
- Search by title, description or event
- Photo/video filters and memory detail view
- Admin-only sign-in, upload and delete
- Supabase Row Level Security and Storage policies
- Responsive layout for phones and desktop

## 1. Requirements
- Node.js 20 or newer
- A Supabase account/project
- A Vercel account (for deployment)

## 2. Create the Supabase backend
1. Create a project at https://supabase.com.
2. Open **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this project, copy all its contents, paste into SQL Editor and run it.
4. The `.env.example` file in this ZIP is pre-filled with this project's Project URL and publishable key. Copy it to `.env` for local development. Never use the `service_role` key in this website.

## 3. Create your administrator account
1. In Supabase, open **Authentication -> Users**.
2. Choose **Add user**, enter your admin email and a strong password, and create the user.
3. The administrator allow-list entry has already been created for `prostephane01@gmail.com` in this project. You do not need to insert the user again.

Only users in this allowlist can upload or delete. Do not create a public sign-up page.

## 4. Run the website on your computer
1. Install Node.js 20+ from https://nodejs.org.
2. Extract this project ZIP.
3. Open a terminal in the extracted `uppersixth-memories` folder.
4. Run:

   ```bash
   npm install
   ```
5. Copy `.env.example` to a new file named `.env`.
6. Add your Supabase project URL and anon/public key:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Open the local address Vite prints (usually `http://localhost:5173`).

If you have not connected Supabase yet, the site displays sample placeholder cards. Real uploads and login require Supabase configuration.

## 5. Deploy to Vercel
1. Create a GitHub repository and upload the extracted project files.
2. Sign in at https://vercel.com and choose **Add New -> Project**.
3. Import your GitHub repository.
4. Vercel should detect Vite automatically. Build command: `npm run build`; output directory: `dist`.
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/public key
6. Deploy. When deployment finishes, open the generated `.vercel.app` URL.

After changing environment variables, redeploy the project.

## 6. Test the admin upload
1. Open your deployed website.
2. Click **Admin**.
3. Sign in with the Supabase admin account you created.
4. Add a title, optional description/category/date, choose a photo or video and publish.
5. Confirm the new item appears in the public gallery.
6. Test on a phone as well as a computer.

## 7. Important privacy and safety notes
- This is a public archive: published images and videos can be viewed, saved or shared by anyone.
- Get permission from classmates before publishing identifiable photos or videos, and respect requests to remove content.
- Avoid posting phone numbers, home addresses, private conversations, school IDs, exam records or other sensitive personal information.
- Do not upload copyrighted music or videos unless you have permission to use them.
- Admin authentication is enforced by Supabase policies, not just by hiding the upload form.
- The included storage bucket is public so gallery media can load without visitor accounts. Deleting a memory removes its database record and uploaded object.
- For large videos or many visitors, review Supabase storage/bandwidth limits and consider compressing videos before upload.

## Troubleshooting
- **"Invalid API key"**: check the URL and anon/public key in `.env` / Vercel environment variables.
- **Admin signs in but is not an administrator**: confirm the signed-in user's UUID exists in `public.admin_users`.
- **Upload fails**: confirm `schema.sql` ran successfully and the chosen file is an allowed image/video under 100 MB.
- **Gallery is empty**: only published database rows are shown. Upload a memory through the admin dashboard.
- **Changes do not appear on Vercel**: redeploy after changing environment variables.

## Project-specific setup already completed
- Supabase Auth admin allow-list includes `prostephane01@gmail.com`.
- `public.memories` has the columns used by this React app.
- Storage bucket `memory-media` is public for viewing; upload/update/delete are restricted to allow-listed admins.
- `/admin` opens the sign-in/admin panel. The panel only exposes upload/delete controls after the signed-in user is confirmed as an admin.
