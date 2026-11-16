import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import PricingTable from './components/PricingTable/PricingTable.jsx';
import CheckoutResult from './components/CheckoutResult/CheckoutResult.jsx';
import ContactForm from './components/ContactForm/ContactForm';

// Cada página es una ruta. Añade las tuyas aquí y su enlace en src/nav.ts
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="precios" element={<main><PricingTable /></main>} />
        <Route path="pago/exito" element={<main><CheckoutResult /></main>} />
        <Route path="contacto" element={<main><h1>Contacto</h1><ContactForm /></main>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
