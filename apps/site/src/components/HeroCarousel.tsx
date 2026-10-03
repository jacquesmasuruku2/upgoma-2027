import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import TypewriterText from "./TypewriterText";
import heroBg from "@/assets/hero-bg.jpg";
import formationImg from "@/assets/formation.jpg";
import auditoireHabineza from "@/assets/auditoire-habineza.jpg";

interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  cta: {
    primary: { text: string; link: string };
    secondary: { text: string; link: string };
  };
}

const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: heroBg,
    title: "Excellence Académique",
    subtitle: "",
    description: "L'Université Polytechnique de Goma offre une éducation de qualité supérieure pour façonner l'avenir de la RD Congo.",
    cta: {
      primary: { text: "S'inscrire", link: "/admission" },
      secondary: { text: "En savoir plus", link: "/about" }
    }
  },
  {
    id: 2,
    image: formationImg,
    title: "Innovation Technologique",
    subtitle: "",
    description: "Des programmes sous système LMD et des infrastructures modernes pour répondre aux défis du 21ème siècle.",
    cta: {
      primary: { text: "A propos de nous", link: "/about" },
      secondary: { text: "Découvrir la Polytechnique", link: "/faculte/Polytechnique" }
    }
  },
  {
    id: 3,
    image: auditoireHabineza,
    title: "Vision Globale",
    subtitle: "",
    description: "Former des professionnels compétents capables de transformer leur communauté et de s'adapter aux défis mondiaux.",
    cta: {
      primary: { text: "Contactez-nous", link: "/contact" },
      secondary: { text: "Nos Publications", link: "/blog" }
    }
  }
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set());

  const slides = heroSlides;

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Preload images
  useEffect(() => {
    slides.forEach((slide, index) => {
      const img = new Image();
      img.onload = () => {
        setImagesLoaded((prev) => new Set([...prev, index]));
      };
      img.src = slide.image;
    });
  }, [slides]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 12000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setDirection(currentIndex === 0 && slides.length - 1 ? -1 : currentIndex === slides.length - 1 ? 1 : 0);
  }, [currentIndex, slides.length]);

  return (
    <section id="hero" className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Carousel Slides */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          custom={direction}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
          style={{ 
            backgroundImage: `url(${slides[currentIndex].image})`,
            backgroundPosition: 'center 35%',
            backgroundSize: 'cover'
          }}
        />
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[hsl(var(--upg-dark))]/70" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-upg-sky/90" aria-hidden="true" />

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-[hsl(var(--upg-dark))]/35 transition-colors hover:bg-upg-sky"
        aria-label="Diapositive précédente"
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-[hsl(var(--upg-dark))]/35 transition-colors hover:bg-upg-sky"
        aria-label="Diapositive suivante"
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "scale-125 bg-upg-sky" : "bg-white/45 hover:bg-white/75"
            }`}
            aria-label={`Aller à la diapositive ${index + 1}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-20 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
          {slides[currentIndex].subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-primary-foreground/80 text-sm font-medium mb-4 tracking-wide uppercase"
            >
              {slides[currentIndex].subtitle}
            </motion.p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight"
          >
            {slides[currentIndex].title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="max-w-2xl mx-auto text-primary-foreground/90 text-lg sm:text-xl mb-8"
          >
            <TypewriterText
              key={currentIndex}
              text={slides[currentIndex].description}
              speed={55}
              delay={600}
            />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-upg-sky px-8 font-semibold text-[hsl(var(--upg-dark))] transition-transform duration-300 hover:bg-upg-sky/90 hover:scale-105"
              onClick={() => (window.location.href = slides[currentIndex].cta.primary.link)}
            >
              {slides[currentIndex].cta.primary.text}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/80 bg-transparent px-8 font-semibold text-white transition-transform duration-300 hover:border-upg-sky hover:bg-upg-sky/15 hover:scale-105"
              onClick={() => (window.location.href = slides[currentIndex].cta.secondary.link)}
            >
              {slides[currentIndex].cta.secondary.text}
            </Button>
          </motion.div>
        </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HeroCarousel;
