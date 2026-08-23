export default function About() {
  return (
    <div className='py-20 px-4 max-w-6xl mx-auto'>
      <h1 className='text-4xl font-bold mb-6 text-slate-850 text-center'>
        About CivicEstate
      </h1>
      
      <p className='mb-6 text-slate-700 text-lg leading-relaxed'>
        <strong>CivicEstate</strong> is a next-generation, secure MERN stack real estate platform built to revolutionize property management, buying, and selling. Designed with transparency and security at its core, our platform bridges the gap between buyers, sellers, and regulatory standards through automated trust systems.
      </p>

      <div className='grid md:grid-cols-3 gap-6 my-10'>
        <div className='p-6 border rounded-lg bg-slate-50 shadow-sm'>
          <h3 className='font-bold text-xl mb-2 text-slate-800'>🔒 Secure Escrow</h3>
          <p className='text-slate-600 text-sm'>
            Our integrated escrow booking token system ensures financial security for both buyers and sellers, holding funds safely until contractual and civic terms are verified.
          </p>
        </div>

        <div className='p-6 border rounded-lg bg-slate-50 shadow-sm'>
          <h3 className='font-bold text-xl mb-2 text-slate-800'>🏛️ Government Land Registry</h3>
          <p className='text-slate-600 text-sm'>
            Every property features verified Lalpurja references and government land registry identifiers to guarantee legal authenticity and prevent fraudulent listings.
          </p>
        </div>

        <div className='p-6 border rounded-lg bg-slate-50 shadow-sm'>
          <h3 className='font-bold text-xl mb-2 text-slate-800'>📋 Civil Audits</h3>
          <p className='text-slate-600 text-sm'>
            Properties undergo structured civil audit tracking status (such as Pending or Confirmed Civil Audit), ensuring structural safety and compliance before transactions occur.
          </p>
        </div>
      </div>

      <h2 className='text-2xl font-bold mb-4 text-slate-800 mt-10'>
        Our Vision & Technology
      </h2>
      <p className='mb-4 text-slate-700 leading-relaxed'>
        Developed as an advanced academic capstone project, CivicEstate implements modern web development best practices using React, Node.js, Express, and MongoDB. Our mission is to eliminate market friction, enhance regulatory compliance, and provide an intuitive user experience for all stakeholders involved in real estate transactions.
      </p>
      
      <p className='text-slate-700 leading-relaxed'>
        Whether you are a buyer searching for verified housing, a seller listing a property, or an administrator handling regulatory approvals, CivicEstate provides a robust, scalable, and secure environment to handle it all.
      </p>
    </div>
  );
}