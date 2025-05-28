import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between">
        <h1 className="font-bold">TimbrApp</h1>
        <div className="space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/requests" className="hover:underline">Richieste</Link>
        </div>
      </nav>
    </header>
  );
}
