export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-warm-white to-lime-lush/10">
      <h1 className="text-4xl font-bold text-ocean-navy mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-dusk-gray mb-8">Sorry, the page you are looking for does not exist.</p>
      <a href="/" className="text-lime-lush font-semibold underline">Go back home</a>
    </div>
  );
} 