import '../styles/globals.css';
import Head from 'next/head';
import Footer from '../components/Footer';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>منصة الطوابع النادرة — Stampcoin</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <Component {...pageProps} />
      <Footer />
    </>
  );
}