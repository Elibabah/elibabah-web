import Link from "next/link";

export function Nav() {
  return (
    <header>
      <nav>
        <Link href="/">Logo</Link>

        <ul>
          <li><Link href="/portfolio">Portfolio</Link></li>
          <li><Link href="/editorial">Editorial</Link></li>
          <li><Link href="/about">About</Link></li>
        </ul>

        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}
