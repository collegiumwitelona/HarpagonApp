import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">Home</h1>
      <Link to="/about" className="text-blue-500 underline">
        Go to About
      </Link>
    </div>
  );
}