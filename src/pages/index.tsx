import { GetStaticProps } from 'next';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
// import { RichText } from 'prismic-dom';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { useState } from 'react';

interface Post {
  slug: string;
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

export default function Home({ postsPagination }: HomeProps) {
  const { results, next_page } = postsPagination;
  const [nextPosts, setNextPosts] = useState([]);
  const [showButtonLoadPosts, setShowButtonLoadPosts] = useState<boolean>(true);

  async function loadMorePosts() {
    if (!next_page) {
      return;
    }
    try {
      const response = await fetch(next_page);
      const nextArr = await response.json();
      const nextPosts = nextArr.results.map(post => {
        return {
          slug: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            ' d MMM Y',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });
      setNextPosts([...results, ...nextPosts]);
      if (!nextArr.next_page) {
        throw new Error();
      }
    } catch {
      setShowButtonLoadPosts(false);
    }
  }

  const dataArr = nextPosts.length === 0 ? results : nextPosts;

  return (
    <div className={`${commonStyles.container} ${styles.postsHome}`}>
      {dataArr.map(post => {
        return (
          <article className={styles.post} key={post.id || post.slug}>
            <Link href={`/post/${post.slug}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <time>
                    <FiCalendar color="#bbbbbb" size="20" />{' '}
                    {post.first_publication_date}
                  </time>
                  <span>
                    <FiUser color="#bbbbbb" size="20" /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </article>
        );
      })}
      {showButtonLoadPosts && (
        <button onClick={loadMorePosts}>Carregar mais posts</button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'blog_post')],
    {
      fetch: ['publication.title', 'publication.content'],
      pageSize: 5,
    }
  );

  const postsPagination = postsResponse.results.map(post => {
    return {
      slug: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        ' d MMM Y',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: postsPagination,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 60 * 24, // 24 horas
  };
};
