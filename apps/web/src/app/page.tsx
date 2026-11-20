import Link from "next/link";

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="product-home">
      <section className="hero" aria-labelledby="home-heading">
        <div>
          <p className="eyebrow">GENETICS FOR INDIVIDUALS AND COUPLES</p>
          <h1 id="home-heading">
            Understand a genetic report <span>together.</span>
          </h1>
          <p className="hero-description">
            Choose two sample reports. See what a shared finding means, try
            passing on gene copies, and take a question with you to a
            counselling visit.
          </p>
          <Link className="hero-link" href="/start">
            Start the guided example <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-note">
            Includes English and Arabic. No account or personal information
            needed.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="art-center">aA</div>
        </div>
      </section>
      <section className="home-choices" aria-labelledby="explore-title">
        <h2 id="explore-title">What would you like to do?</h2>
        <div className="home-grid">
          <article>
            <h3>Learn together</h3>
            <p>
              Try seven short lessons. Move gene copies, compare possible
              outcomes, or explore what a test can miss.
            </p>
            <Link href="/learn">Browse interactive lessons →</Link>
          </article>
          <article>
            <h3>Prepare for counselling</h3>
            <p>
              Choose questions in English or Arabic, explore family history, and
              download a visit checklist.
            </p>
            <Link href="/journey">Build a visit checklist →</Link>
          </article>
          <article>
            <h3>Explore care near you</h3>
            <p>
              Choose a sample district, compare services, and plan a visit on
              the map.
            </p>
            <Link href="/care-atlas">Open Care Atlas →</Link>
          </article>
          <article>
            <h3>Try a private account</h3>
            <p>
              Open a sample report and decide separately whether to use it,
              compare it with a partner’s, or share an outcome.
            </p>
            <Link href="/workspace">Try the consent workflow →</Link>
          </article>
        </div>
      </section>
      <aside className="planner-entry">
        <h2>Planning services for a community?</h2>
        <p>
          Explore referral links or place a new centre and measure how access
          changes for the simulated population.
        </p>
        <Link href="/care-atlas?mode=ecosystem">
          Explore the service network
        </Link>
        <Link href="/care-atlas?mode=policy">Simulate service expansion</Link>
      </aside>
      <footer>
        <span>Synthetic demonstration · Not for clinical use</span>
        <Link href="/status">Service status</Link>
      </footer>
    </main>
  );
}
