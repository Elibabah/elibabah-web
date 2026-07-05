import Image from 'next/image'
import Link from 'next/link'
import UnderConstructionImage from './assets/pngwing.com.png'

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-7 bg-zinc-50 px-6 text-center font-sans dark:bg-black">
      <Image
        src={UnderConstructionImage}
        width={100}
        height={100}
        alt="Under construction illustration"
      /> 

      <div>
        This site is currently under construction. You can visit
      </div>  

      <Link href="https://www.linkedin.com/in/elibabah/">Elibabah</Link>
    </main>
  );
}
