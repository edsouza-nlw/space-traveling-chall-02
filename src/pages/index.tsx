import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { useState } from 'react';

import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

interface dataResponse {
  next_page: string | null;
  results: Post[];
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  function FetchMorePosts(): void {
    const url = postsPagination.next_page;
    fetch(url)
      .then(response => response.json())
      .then((data: dataResponse) => {
        setNextPage(data.next_page);
        setPosts([...posts, ...data.results]);
      });
  }

  return (
    <>
      <Head>
        <title>Home | Space Traveling</title>
      </Head>
      <Header />

      <main className={styles.container}>
        <section>
          {posts.map(post => (
            <article className={styles.postContent} key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>

                  <div>
                    <time>
                      <FiCalendar />
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM uu',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <span>
                      <FiUser /> {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            </article>
          ))}
        </section>
      </main>
      {nextPage && (
        <button
          className={styles.buttonMore}
          type="button"
          onClick={FetchMorePosts}
        >
          Carregar mais posts
        </button>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 3,
    }
  );

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: post.data,
    };
  });

  const postsPagination = {
    next_page: response.next_page,
    results: posts,
  };

  return {
    props: { postsPagination },
  };
};
