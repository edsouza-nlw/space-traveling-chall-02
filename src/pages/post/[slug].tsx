import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div className="">Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Space Traveling</title>
      </Head>
      <Header />

      <div className={styles.post}>
        <figure>
          <img src={post.data.banner.url} alt={post.data.title} />
        </figure>

        <main className={styles.post__main}>
          <h1 className={styles.post__title}>{post.data.title}</h1>
          <div className={styles.post__info}>
            <div className="">
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM uu', {
                locale: ptBR,
              })}
            </div>
            <div className="">
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div className="">
              <FiClock />
              <span>4 min</span>
            </div>
          </div>
          {post.data.content.map(content => (
            <div className={styles.post__content} key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                className={styles.post__contentBody}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </div>
          ))}
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });
  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        };
      }),
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 60 * 60, // 1hora
  };
};
