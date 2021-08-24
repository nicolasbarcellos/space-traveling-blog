import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import PrismicDOM from 'prismic-dom';
import { RichText } from 'prismic-dom';

import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

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

interface Content {
  heading: string;
  body: {
    text: string;
  }[];
}

export default function Post({ post }: PostProps): JSX.Element {
  const { data } = post;
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>

      <div className={styles.banner}>
        <img src="/banner.png" alt={data.title} />
      </div>

      <main className={`${styles.postWrapper} ${commonStyles.container}`}>
        <h1>{data.title}</h1>
        <div className={styles.postInfo}>
          <span>
            <FiCalendar color="#bbbbbb" size="20" />{' '}
            {post.first_publication_date}
          </span>
          <span>
            <FiUser color="#bbbbbb" size="20" /> {data.author}
          </span>
          <span>
            <FiClock color="#bbbbbb" size="20" /> {readTime} min
          </span>
        </div>
        <div className={styles.postContent}>
          {data.content.map(content => {
            return (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                ></div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'blog_post')],
    {
      pageSize: 4,
    }
  );
  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('blog_post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'd MMM Y',
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 3600,
  };
};
